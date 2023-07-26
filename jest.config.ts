import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  moduleDirectories: ['node_modules', 'src'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
export default config;