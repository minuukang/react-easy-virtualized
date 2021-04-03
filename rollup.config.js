import typescript from 'rollup-plugin-typescript2';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

process.env.BABEL_ENV = 'production';

function setUpRollup({ input, output }) {
  return {
    input,
    exports: 'named',
    output,
    watch: {
      include: '*',
      exclude: 'node_modules/**',
    },
    plugins: [
      peerDepsExternal(),
      resolve({ extensions }),
      commonjs({
        include: /node_modules/,
      }),
      typescript({ useTsconfigDeclarationDir: true }),
    ],
    external: ['react', 'react-dom'],
  };
}

export default [
  setUpRollup({
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs.js',
      sourcemap: true,
      format: 'cjs',
    },
  }),
  setUpRollup({
    input: 'src/index.ts',
    output: {
      file: 'dist/esm.js',
      sourcemap: true,
      format: 'esm',
    },
  }),
  {
    input: "./src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  }
];