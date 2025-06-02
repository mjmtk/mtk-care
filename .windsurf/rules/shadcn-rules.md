---
trigger: always_on
---

- when developing frontend components ALWAYS use ShadCN components where applicable

-us Context 7 MCP tool to find applicable components and packages if you don't know about one. You can also use this to know about a library or a package.

- you can also use Serper and Fetch MCP Tools for something that Context 7 can't satisfy

- If the user provides a URL for a componetn or a package then use the fetch tool to scrape it and use that.

- Maintain a list of used ShadCN components in docs/frontend/ShadCN-context.md (make one if it doesn't exist). It should contain all the components used and reference this to check if  you need to install a ShadCN component from scratch with the CLI tool or not.
