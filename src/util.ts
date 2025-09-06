// Utility functions for Swarm JavaScript implementation

export function debugPrint(debug: boolean, ...args: any[]): void {
  if (!debug) {
    return;
  }
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const message = args.map(arg => String(arg)).join(' ');
  console.log(`\x1b[97m[\x1b[90m${timestamp}\x1b[97m]\x1b[90m ${message}\x1b[0m`);
}

export function mergeFields(target: any, source: any): void {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      target[key] = (target[key] || '') + value;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeFields(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

export function mergeChunk(finalResponse: any, delta: any): void {
  const deltaClone = { ...delta };
  delete deltaClone.role;
  delete deltaClone.tool_calls; // Remove tool_calls to handle separately
  mergeFields(finalResponse, deltaClone);

  const toolCalls = delta.tool_calls;
  if (toolCalls && toolCalls.length > 0) {
    const index = toolCalls[0].index;
    delete toolCalls[0].index;
    if (!finalResponse.tool_calls) {
      finalResponse.tool_calls = {};
    }
    if (!finalResponse.tool_calls[index]) {
      finalResponse.tool_calls[index] = {
        function: { arguments: '', name: '' },
        id: '',
        type: '',
      };
    }
    mergeFields(finalResponse.tool_calls[index], toolCalls[0]);
  }
}

interface JsDocParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export function functionToJson(func: Function): any {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'object',
    'array': 'array',
    'undefined': 'null',
  };

  const funcStr = func.toString();
  const name = func.name;
  
  // Parse JSDoc
  const jsDocInfo = parseJsDoc(funcStr);
  
  // Extract parameter names from function signature
  const paramMatch = funcStr.match(/\(([^)]*)\)/);
  const paramString = paramMatch ? paramMatch[1] : '';
  
  // Handle destructured parameters
  const isDestructured = paramString.includes('{');
  let paramNames: string[] = [];
  
  if (isDestructured) {
    // Extract destructured parameter names
    const destructuredMatch = paramString.match(/{\s*([^}]+)\s*}/);
    if (destructuredMatch) {
      paramNames = destructuredMatch[1]
        .split(',')
        .map(p => p.trim().split(':')[0].trim())
        .filter(p => p && p !== 'context_variables');
    }
  } else {
    // Regular parameters
    paramNames = paramString
      .split(',')
      .map(p => p.trim().split('=')[0].trim().split(':')[0].trim())
      .filter(p => p && p !== 'context_variables');
  }

  const parameters: Record<string, any> = {};
  const required: string[] = [];

  // Build parameter schema
  for (const paramName of paramNames) {
    if (paramName && paramName !== 'context_variables') {
      const jsDocParam = jsDocInfo.params.find(p => p.name === paramName);
      
      const paramSchema: any = {
        type: jsDocParam?.type && typeMap[jsDocParam.type] ? typeMap[jsDocParam.type] : 'string'
      };
      
      if (jsDocParam?.description) {
        paramSchema.description = jsDocParam.description;
      }
      
      parameters[paramName] = paramSchema;
      
      // Check if parameter is required
      const isOptional = funcStr.includes(`${paramName}?:`) || 
                       funcStr.includes(`${paramName} =`) || 
                       funcStr.includes(`${paramName}=`) ||
                       jsDocParam?.optional;
      
      if (!isOptional) {
        required.push(paramName);
      }
    }
  }

  return {
    type: 'function',
    function: {
      name,
      description: jsDocInfo.description || '',
      parameters: {
        type: 'object',
        properties: parameters,
        required,
      },
    },
  };
}

function parseJsDoc(funcStr: string): { description: string; params: JsDocParam[] } {
  const jsdocMatch = funcStr.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
  
  if (!jsdocMatch) {
    // Try regular comment
    const commentMatch = funcStr.match(/\/\*\s*([\s\S]*?)\s*\*\//);
    if (commentMatch) {
      return { description: commentMatch[1].trim(), params: [] };
    }
    return { description: '', params: [] };
  }
  
  const lines = jsdocMatch[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line);
  
  let description = '';
  const params: JsDocParam[] = [];
  
  for (const line of lines) {
    if (line.startsWith('@param')) {
      // Parse @param {type} [name] - description
      const paramMatch = line.match(/@param\s*(?:\{([^}]+)\})?\s*(\[?\w+\]?)\s*(?:-\s*)?(.*)$/);
      if (paramMatch) {
        const type = paramMatch[1] || 'string';
        const nameWithBrackets = paramMatch[2];
        const paramDescription = paramMatch[3] || '';
        
        const optional = nameWithBrackets.includes('[');
        const paramName = nameWithBrackets.replace(/[\[\]]/g, '').split('=')[0];
        
        params.push({
          name: paramName,
          type: type.toLowerCase(),
          description: paramDescription,
          optional
        });
      }
    } else if (!line.startsWith('@')) {
      description += (description ? ' ' : '') + line;
    }
  }
  
  return { description, params };
}