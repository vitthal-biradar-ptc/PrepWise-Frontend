import { Injectable } from '@angular/core';

export interface Tool {
  getDeclaration(): any;
  execute(args: any): Promise<any>;
}

@Injectable({
  providedIn: 'root'
})
export class ToolManagerService {
  private tools = new Map<string, Tool>();

  registerTool(name: string, toolInstance: Tool): void {
    if (this.tools.has(name)) {
      console.warn(`Tool ${name} is already registered`);
      return;
    }
    this.tools.set(name, toolInstance);
    console.info(`Tool ${name} registered successfully`);
  }

  getToolDeclarations(): any[] {
    const allDeclarations: any[] = [];
    
    this.tools.forEach((tool, name) => {
      if (tool.getDeclaration) {
        allDeclarations.push(tool.getDeclaration());
      } else {
        console.warn(`Tool ${name} does not have a getDeclaration method`);
      }
    });

    return allDeclarations;
  }

  async handleToolCall(functionCall: any): Promise<any> {
    const { name, args, id } = functionCall;
    console.info(`Handling tool call: ${name}`, { args });

    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        output: null,
        id: id,
        error: `Tool ${name} not found`
      };
    }

    try {
      const result = await tool.execute(args);
      return {
        output: result,
        id: id,
        error: null
      };
    } catch (error: any) {
      console.error(`Tool execution failed: ${name}`, error);
      return {
        output: null,
        id: id,
        error: error.message
      };
    }
  }
}
