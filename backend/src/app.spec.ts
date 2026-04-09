import { getSystemInfo } from './services/system.service';

describe('getSystemInfo', () => {
  it('describes the Express backend', () => {
    expect(getSystemInfo()).toEqual(
      expect.objectContaining({
        name: 'control-financiero-api',
        docs: '/docs',
      }),
    );
    expect(getSystemInfo().description).toContain('Express');
  });
});
