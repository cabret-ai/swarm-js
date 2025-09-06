import { functionToJson } from '../../src/util';

describe('Enhanced Function Schema Generation', () => {
  test('parses JSDoc comments with parameter types and descriptions', () => {
    function getWeather(location: string, time?: string) {
      /**
       * Get weather for a location
       * @param {string} location - Location MUST be a city
       * @param {string} [time] - Time to get weather for
       */
      return `Weather in ${location}`;
    }

    const schema = functionToJson(getWeather);

    expect(schema).toEqual({
      type: 'function',
      function: {
        name: 'getWeather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Location MUST be a city'
            },
            time: {
              type: 'string',
              description: 'Time to get weather for'
            }
          },
          required: ['location'],
        }
      }
    });
  });

  test('handles destructured parameters correctly', () => {
    function sendEmail({ recipient, subject, body }: {
      recipient: string;
      subject: string;
      body: string;
    }) {
      /**
       * Send an email
       * @param {string} recipient - Email recipient
       * @param {string} subject - Email subject
       * @param {string} body - Email body
       */
      return 'Email sent';
    }

    const schema = functionToJson(sendEmail);

    expect(schema.function.parameters!.properties).toEqual({
      recipient: { type: 'string', description: 'Email recipient' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' }
    });
  });

  test('handles different JSDoc types', () => {
    function testTypes(count: number, enabled: boolean, items: any[], config: object) {
      /**
       * Test different types
       * @param {number} count - Number of items
       * @param {boolean} enabled - Whether feature is enabled
       * @param {array} items - List of items
       * @param {object} config - Configuration object
       */
      return null;
    }

    const schema = functionToJson(testTypes);

    expect(schema.function.parameters!.properties).toEqual({
      count: { type: 'number', description: 'Number of items' },
      enabled: { type: 'boolean', description: 'Whether feature is enabled' },
      items: { type: 'array', description: 'List of items' },
      config: { type: 'object', description: 'Configuration object' }
    });
  });

  test('handles optional parameters with defaults', () => {
    function testOptional(name: string, age = 18, city?: string) {
      /**
       * Test optional parameters
       * @param {string} name - User name
       * @param {number} [age=18] - User age
       * @param {string} [city] - User city
       */
      return { name, age, city };
    }

    const schema = functionToJson(testOptional);

    expect(schema.function.parameters!.required).toEqual(['name']);
    expect(schema.function.parameters!.properties).toHaveProperty('age');
    expect(schema.function.parameters!.properties).toHaveProperty('city');
  });

  test('handles functions without JSDoc', () => {
    function noJsDoc(param1: string, param2: number) {
      return param1 + param2;
    }

    const schema = functionToJson(noJsDoc);

    expect(schema.function.description).toBe('');
    expect(schema.function.parameters!.properties).toEqual({
      param1: { type: 'string' },
      param2: { type: 'string' } // Note: defaults to string in current implementation
    });
  });
});