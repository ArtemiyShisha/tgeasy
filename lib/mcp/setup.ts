/**
 * @fileoverview MCP (Meta Component Protocol) setup and initialization.
 * This file configures the MCP client for UI generation based on project standards.
 */

import mcpConfig from '@/configs/mcp-config.json';

/**
 * Represents the configuration for the MCP client.
 */
interface MCPClientConfig {
  apiKey: string;
  projectId: string;
  // Add other configuration options as needed by the MCP client library
}

/**
 * Initializes the MCP client with the project's configuration.
 *
 * This function should be called at the application's entry point or
 * in a relevant setup file to ensure the MCP client is available
 * for UI generation tasks.
 *
 * @returns A configured MCP client instance.
 * @throws {Error} If MCP API key or Project ID are not defined in environment variables.
 */
export function setupMCPClient() {
  const apiKey = process.env.MCP_API_KEY;
  const projectId = process.env.MCP_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error('MCP_API_KEY and MCP_PROJECT_ID must be set in environment variables.');
  }

  const config: MCPClientConfig = {
    apiKey,
    projectId,
  };

  // Assuming there's an MCP client library to instantiate
  // e.g., import { MCPClient } from '@21st-dev/mcp-client';
  // const mcpClient = new MCPClient(config);

  console.log('MCP Client Initialized with project:', config.projectId);

  // return mcpClient;
  return { config }; // Returning config for now
}

/**
 * A shared instance of the MCP client for use throughout the application.
 */
export const mcpClient = setupMCPClient(); 