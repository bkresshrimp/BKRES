module.exports = {
	env: { node: true, es2022: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: false },
	plugins: ['@typescript-eslint'],
	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
			},
		},
	],
};
