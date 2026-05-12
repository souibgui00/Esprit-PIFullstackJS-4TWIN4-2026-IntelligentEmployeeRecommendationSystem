jest.mock('axios', () => {
  const mockApiInstance = {
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockApiInstance),
    },
  };
});

describe('api service', () => {
  it('creates axios instance with default baseURL and json header', () => {
    let axios;
    jest.isolateModules(() => {
      axios = require('axios').default;
      require('../api');
    });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('registers a request interceptor that injects bearer token when available', () => {
    let api;
    jest.isolateModules(() => {
      api = require('../api').default;
    });

    expect(api.interceptors.request.use).toHaveBeenCalled();
    const interceptorFn = api.interceptors.request.use.mock.calls[0][0];

    global.localStorage.getItem.mockImplementation((key) =>
      key === 'token' ? 'abc-token' : null,
    );

    const config = { headers: {} };
    const result = interceptorFn(config);

    expect(result.headers.Authorization).toBe('Bearer abc-token');
  });

  it('leaves headers untouched when no token exists', () => {
    let api;
    jest.isolateModules(() => {
      api = require('../api').default;
    });

    const interceptorFn = api.interceptors.request.use.mock.calls[0][0];
    global.localStorage.getItem.mockReturnValue(null);

    const config = { headers: {} };
    const result = interceptorFn(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});
