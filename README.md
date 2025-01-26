# mcp-jinaai-grounding
[![smithery badge](https://smithery.ai/badge/@spences10/mcp-jinaai-grounding)](https://smithery.ai/server/@spences10/mcp-jinaai-grounding)

A Model Context Protocol (MCP) server for integrating Jina.ai's
Grounding API with LLMs. This server provides efficient and
comprehensive web content grounding capabilities, optimized for
enhancing LLM responses with factual, real-time web content.

<a href="https://glama.ai/mcp/servers/urkuhet67l">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/urkuhet67l/badge" />
</a>

## Features

- 🌐 Advanced web content grounding through Jina.ai Grounding API
- 🚀 Real-time content verification and fact-checking
- 📚 Comprehensive web content analysis
- 🔄 Clean format optimized for LLMs
- 🎯 Precise content relevance scoring
- 🏗️ Built on the Model Context Protocol

## Configuration

This server requires configuration through your MCP client. Here are
examples for different environments:

### Cline Configuration

Add this to your Cline MCP settings:

```json
{
	"mcpServers": {
		"jinaai-grounding": {
			"command": "node",
			"args": ["-y", "mcp-jinaai-grounding"],
			"env": {
				"JINAAI_API_KEY": "your-jinaai-api-key"
			}
		}
	}
}
```

### Claude Desktop with WSL Configuration

For WSL environments, add this to your Claude Desktop configuration:

```json
{
	"mcpServers": {
		"jinaai-grounding": {
			"command": "wsl.exe",
			"args": [
				"bash",
				"-c",
				"JINAAI_API_KEY=your-jinaai-api-key npx mcp-jinaai-grounding"
			]
		}
	}
}
```

### Environment Variables

The server requires the following environment variable:

- `JINAAI_API_KEY`: Your Jina.ai API key (required)

## API

The server implements MCP tools for grounding LLM responses with web
content:

### ground_content

Ground LLM responses with real-time web content using Jina.ai
Grounding.

Parameters:

- `query` (string, required): The text to ground with web content
- `no_cache` (boolean, optional): Bypass cache for fresh results.
  Defaults to false
- `format` (string, optional): Response format ("json" or "text").
  Defaults to "text"
- `token_budget` (number, optional): Maximum number of tokens for this
  request
- `browser_locale` (string, optional): Browser locale for rendering
  content
- `stream` (boolean, optional): Enable stream mode for large pages.
  Defaults to false
- `gather_links` (boolean, optional): Gather all links at the end of
  response. Defaults to false
- `gather_images` (boolean, optional): Gather all images at the end of
  response. Defaults to false
- `image_caption` (boolean, optional): Caption images in the content.
  Defaults to false
- `enable_iframe` (boolean, optional): Extract content from iframes.
  Defaults to false
- `enable_shadow_dom` (boolean, optional): Extract content from shadow
  DOM. Defaults to false
- `resolve_redirects` (boolean, optional): Follow redirect chains to
  final URL. Defaults to true

## Development

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm run build
```

4. Run in development mode:

```bash
pnpm run dev
```

### Publishing

1. Update version in package.json
2. Build the project:

```bash
pnpm run build
```

3. Publish to npm:

```bash
pnpm run release
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the
  [Model Context Protocol](https://github.com/modelcontextprotocol)
- Powered by [Jina.ai Grounding API](https://jina.ai)
