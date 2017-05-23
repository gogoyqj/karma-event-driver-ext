module.exports = {
    "parser": "babel-eslint",
    "extends": "eslint:recommended",
	"parserOptions": {
		ecmaFeatures: {
			modules: true,
			jsx: true
		}
	},
	"compilerOptions": {
        "experimentalDecorators": true
    },
	"env": {
		browser: true,
		jasmine: true,
		node: true,
		es6: true
	},
	globals: {
		sinon: true,
		expect: true,
		io: true
	},
    "rules": {
        // Additional, per-project rules...
		"no-console": 1
    }
};
