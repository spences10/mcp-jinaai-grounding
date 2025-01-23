#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
	readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
);
const { name, version } = pkg;

// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
const JINAAI_API_KEY = process.env.JINAAI_API_KEY;
if (!JINAAI_API_KEY) {
	throw new Error('JINAAI_API_KEY environment variable is required');
}

interface GroundingReference {
	url: string; // Source URL
	keyQuote: string; // Supporting quote from the source
	isSupportive: boolean; // Whether the reference supports or contradicts the statement
}

interface GroundingResponse {
	factuality: number; // Score between 0-1 indicating confidence
	result: boolean; // True if statement is verified as factual
	reason: string; // Explanation of the verification result
	references: GroundingReference[]; // Supporting/contradicting sources (up to 30)
	usage: {
		tokens: number; // Number of tokens processed
	};
}

interface GroundingOptions {
	statement: string; // Statement to verify
	references?: string[]; // Optional list of URLs to restrict search to
	no_cache?: boolean; // Whether to bypass cache for fresh results
}

const is_valid_grounding_args = (
	args: any,
): args is GroundingOptions =>
	typeof args === 'object' &&
	args !== null &&
	typeof args.statement === 'string' &&
	args.statement.trim() !== '' &&
	(args.references === undefined ||
		(Array.isArray(args.references) &&
			args.references.every((ref: string) => typeof ref === 'string'))) &&
	(args.no_cache === undefined || typeof args.no_cache === 'boolean');

class JinaGroundingServer {
	private server: Server;
	private base_url = 'https://g.jina.ai';

	constructor() {
		this.server = new Server(
			{
				name,
				version,
			},
			{
				capabilities: {
					tools: {},
				},
			},
		);

		this.setup_handlers();

		this.server.onerror = (error) =>
			console.error('[MCP Error]', error);
	}

	private setup_handlers() {
		this.server.setRequestHandler(
			ListToolsRequestSchema,
			async () => ({
				tools: [
					{
						name: 'ground_statement',
						description:
							'Ground a statement using real-time web search results to check factuality. ' +
							'When providing URLs via the references parameter, ensure they are publicly accessible ' +
							'and contain relevant information about the statement. If the URLs do not contain ' +
							'the necessary information, try removing the URL restrictions to search the entire web.',
						inputSchema: {
							type: 'object',
							properties: {
								statement: {
									type: 'string',
									description: 'Statement to be grounded',
								},
								references: {
									type: 'array',
									items: {
										type: 'string',
									},
									description:
										'Optional list of URLs to restrict search to. Only provide URLs that are ' +
										'publicly accessible and contain information relevant to the statement. ' +
										'If the URLs do not contain the necessary information, the grounding will fail. ' +
										'For best results, either provide URLs you are certain contain the information, ' +
										'or omit this parameter to search the entire web.',
								},
								no_cache: {
									type: 'boolean',
									description:
										'Whether to bypass cache for fresh results',
									default: false,
								},
							},
							required: ['statement'],
						},
					},
				],
			}),
		);

		this.server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				if (request.params.name !== 'ground_statement') {
					throw new McpError(
						ErrorCode.MethodNotFound,
						`Unknown tool: ${request.params.name}`,
					);
				}

				const args = request.params.arguments;

				if (!is_valid_grounding_args(args)) {
					throw new McpError(
						ErrorCode.InvalidParams,
						'Invalid parameters. Required: statement (string). Optional: references (string[]), no_cache (boolean)',
					);
				}

				try {
					const headers: Record<string, string> = {
						'Content-Type': 'application/json',
						Accept: 'application/json',
						Authorization: `Bearer ${JINAAI_API_KEY}`,
					};

					// Add optional headers
					if (args.references?.length) {
						headers['X-Site'] = args.references.join(',');
					}
					if (args.no_cache) {
						headers['X-No-Cache'] = 'true';
					}

					const response = await fetch(this.base_url, {
						method: 'POST',
						headers,
						body: JSON.stringify({
							statement: args.statement.trim(),
						}),
					});

					if (!response.ok) {
						const error_text = await response.text();
						let error_json;
						try {
							error_json = JSON.parse(error_text);
						} catch {
							throw new Error(
								`HTTP error! status: ${response.status}, message: ${error_text}`,
							);
						}

						// Handle specific error cases
						if (error_json.status === 42206) {
							throw new McpError(
								ErrorCode.InvalidParams,
								'The provided URLs did not contain relevant information for fact-checking. This can happen when:\n' +
								'1. The URLs are not publicly accessible\n' +
								'2. The URLs do not contain information about the specific statement\n' +
								'3. The information exists but is not in an easily searchable format\n\n' +
								'Suggestions:\n' +
								'- Remove the URL restrictions to search the entire web\n' +
								'- Provide different URLs that you are certain contain the information\n' +
								'- Verify the URLs are publicly accessible and contain relevant content',
							);
						}

						// Handle other API errors
						throw new Error(
							`API error! status: ${response.status}, message: ${error_json.readableMessage || error_json.message || error_text}`,
						);
					}

					const result = (await response.json()) as {
						code: number;
						status: number;
						data: GroundingResponse;
					};

					if (result.code !== 200) {
						throw new Error(`API error! status: ${result.status}`);
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(result.data, null, 2),
							},
						],
					};
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					throw new McpError(
						ErrorCode.InternalError,
						`Failed to ground statement: ${message}`,
					);
				}
			},
		);
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error('Jina Grounding MCP server running on stdio');
	}
}

const server = new JinaGroundingServer();
server.run().catch(console.error);
