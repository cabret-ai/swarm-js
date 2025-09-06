// Tests for util functions - JavaScript port of Python tests/test_util.py
// Function schema generation tests

import { functionToJson } from '../src/util';

describe('Utility Functions', () => {
  describe('functionToJson', () => {
    test('basic function', () => {
      function basicFunction(arg1: string, arg2: string) {
        return arg1 + arg2;
      }

      const result = functionToJson(basicFunction);
      
      expect(result).toEqual({
        type: 'function',
        function: {
          name: 'basicFunction',
          description: '',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
              arg2: { type: 'string' },
            },
            required: ['arg1', 'arg2'],
          },
        },
      });
    });

    test('complex function with types and descriptions', () => {
      function complexFunctionWithTypesAndDescriptions(
        arg1: number, 
        arg2: string, 
        arg3: number = 3.14, 
        arg4: boolean = false
      ) {
        /* This is a complex function with a docstring. */
        return arg1 + arg2;
      }

      const result = functionToJson(complexFunctionWithTypesAndDescriptions);
      
      expect(result).toEqual({
        type: 'function',
        function: {
          name: 'complexFunctionWithTypesAndDescriptions',
          description: 'This is a complex function with a docstring.',
          parameters: {
            type: 'object',
            properties: {
              arg1: { type: 'string' }, // Note: JavaScript version defaults to string
              arg2: { type: 'string' },
              arg3: { type: 'string' }, // Optional params still get properties
              arg4: { type: 'string' },
            },
            required: ['arg1', 'arg2'], // Only required params
          },
        },
      });
    });

    test('function with destructured parameters', () => {
      function functionWithDestructuring({ location, time = 'now' }: { location: string; time?: string }) {
        /* Get weather for a location */
        return `Weather in ${location} at ${time}`;
      }

      const result = functionToJson(functionWithDestructuring);
      
      expect(result.type).toBe('function');
      expect(result.function.name).toBe('functionWithDestructuring');
      expect(result.function.description).toBe('Get weather for a location');
      expect(result.function.parameters.type).toBe('object');
      expect(result.function.parameters.properties).toBeDefined();
    });

    test('function with inline comment', () => {
      function functionWithComment({ location }: { location: string }) {
        /* This is an inline comment */
        return `Weather in ${location}`;
      }

      const result = functionToJson(functionWithComment);
      
      expect(result.function.name).toBe('functionWithComment');
      expect(result.function.description).toBe('This is an inline comment');
    });

    test('function with context_variables parameter', () => {
      function functionWithContextVars(
        { name, context_variables }: { name: string; context_variables?: any }
      ) {
        return `Hello ${name}`;
      }

      const result = functionToJson(functionWithContextVars);
      
      // context_variables should be filtered out
      expect(result.function.parameters.properties.context_variables).toBeUndefined();
      expect(result.function.parameters.required).not.toContain('context_variables');
    });

    test('arrow function', () => {
      const arrowFunction = (arg1: string, arg2: string) => {
        return arg1 + arg2;
      };

      const result = functionToJson(arrowFunction);
      
      expect(result.function.name).toBe('arrowFunction');
      expect(result.function.parameters.properties.arg1).toEqual({ type: 'string' });
      expect(result.function.parameters.properties.arg2).toEqual({ type: 'string' });
      expect(result.function.parameters.required).toEqual(['arg1', 'arg2']);
    });

    test('anonymous function', () => {
      const anonymousFunction = function(arg1: string) {
        return arg1;
      };

      const result = functionToJson(anonymousFunction);
      
      expect(result.function.name).toBe('anonymousFunction');
      expect(result.function.parameters.properties.arg1).toEqual({ type: 'string' });
      expect(result.function.parameters.required).toEqual(['arg1']);
    });
  });
});