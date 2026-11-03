/**
 * BrightScript grammar for tree-sitter.
 *
 * Based on DusanLesan/tree-sitter-brightscript (MIT), extended with the
 * constructs real Roku code uses that the original grammar lacked:
 * print, dim, stop, rem comments, the #if/#const/#error preprocessor,
 * hexadecimal/exponent numeric literals, associative-array keys,
 * newline-separated fields, goto labels, and `next` loop terminators.
 */
const PREC = {
	OR: 1,
	AND: 2,
	COMP: 3,
	ADD: 9,
	MULT: 10,
	UNARY: 11,
};

const WHITESPACE = /\s/;
const DECIMAL_DIGIT = /[0-9]/;

const _numeral = (digit) => choice(
	repeat1(digit),
	seq(repeat1(digit), '.', repeat(digit)),
	seq(repeat(digit), '.', repeat1(digit)),
);

const _list = (rule, separator) => seq(rule, repeat(seq(separator, rule)));

module.exports = grammar({
	name: 'brightscript',

	rules: {
		source_file: $ => $._block,

		_block: $ => choice(
			seq(repeat1($.statement), optional($.return_statement)),
			seq(repeat($.statement), $.return_statement)
		),

		statement: $ => choice(
			$.assignment_statement,
			$.function_call,
			$.goto_statement,
			$.exit_statement,
			$.while_statement,
			$.if_statement,
			$.inline_if_statement,
			$.for_statement,
			$.try_statement,
			$.function_declaration,
			$.print_statement,
			$.dim_statement,
			$.stop_statement,
			$.label_statement,
			$.preproc_if_statement,
			$.preproc_const_statement,
			$.preproc_error_statement,
		),

		print_statement: $ => seq(
			choice('print', '?'),
			optional(seq(
				$.expression,
				repeat(seq(choice(';', ','), $.expression)),
			)),
			optional(';'),
		),

		dim_statement: $ => seq(
			'dim',
			commaSep1($.dim_declaration),
		),
		dim_declaration: $ => seq(
			field('name', $.identifier),
			'[',
			$.expression,
			repeat(seq(',', $.expression)),
			']',
		),

		stop_statement: () => 'stop',

		label_statement: $ => seq(
			field('name', $.identifier),
			':',
		),

		// #if / #else if / #else / #end if preprocessor blocks, #const and
		// #error. The condition is any BrightScript expression evaluated at
		// compile time (typically a #const identifier).
		preproc_if_statement: $ => seq(
			'#if',
			field('condition', $.expression),
			optional('then'),
			optional(field('consequence', $._block)),
			repeat($.preproc_else_if_clause),
			optional($.preproc_else_clause),
			'#end if',
		),
		preproc_else_if_clause: $ => seq(
			'#else if',
			field('condition', $.expression),
			optional('then'),
			optional(field('consequence', $._block)),
		),
		preproc_else_clause: $ => seq(
			'#else',
			optional(field('consequence', $._block)),
		),
		preproc_const_statement: $ => seq(
			'#const',
			field('name', $.identifier),
			'=',
			field('value', $.expression),
		),
		preproc_error_statement: $ => seq(
			'#error',
			optional(field('message', /[^#\n]*/)),
		),

		function_declaration: $ => choice(
			seq(
				'sub',
				field('name', $.identifier),
				'(',
				optional(field('parameters', optional(commaSep1($.parameter)))),
				')',
				optional(field('body', $._block)),
				'end sub',
			),
			seq(
				'function',
				field('name', $.identifier),
				'(',
				optional(field('parameters', optional(commaSep1($.parameter)))),
				')',
				optional(seq('as', $.type)),
				optional(field('body', $._block)),
				'end function',
			),
		),

		parameter: $ => seq(
			field('parameterName', $.identifier),
			optional(seq('as', $.type)),
		),

		type: $ => choice(
			'boolean',
			'bool',
			'integer',
			'longInteger',
			'long',
			'float',
			'double',
			'string',
			'object',
			'interface',
			'dynamic',
		),

		assignment_statement: $ => seq(
			$.variable,
			'=',
			$.expression_list,
		),

		function_call: $ => seq(
			field('name', choice(
				$._prefix_expression,
				$._table_method_variable,
			)),
			field('arguments', $.argument_list),
		),

		_table_method_variable: $ => seq(field('table', $.prefix_expression), $._method_identifier),
		_method_identifier: $ => seq(':', field('method', $.identifier)),

		argument_list: $ => choice(
			seq(
				'(',
				optional($.expression_list),
				')'
			),
			$.associative_array,
			$.string,
		),

		for_statement: $ => seq(
			'for',
			field('clause', choice($.for_each_clause, $.for_numeric_clause)),
			optional(field('body', $._block)),
			choice(seq('end', 'for'), 'next'),
		),
		for_each_clause: $ => seq(
			'each',
			field('left', $.identifier),
			'in',
			field('right', $.expression),
		),
		for_numeric_clause: $ => seq(
			field('name', $.identifier),
			'=',
			field('start', $.expression),
			'to',
			field('end', $.expression),
			optional(seq('step', field('step', $.expression))),
		),

		inline_if_statement: $ => seq(
			'if',
			field('condition', $.expression),
			'then',
			field('consequence', $._inline_block),
		),

		_inline_block: $ => seq(
			choice($.statement, $.return_statement),
			repeat(seq(':', choice($.statement, $.return_statement))),
		),

		if_statement: $ => seq(
			'if',
			field('condition', $.expression),
			optional('then'),
			/\n/,
			optional(field('consequence', $._block)),
			repeat(field('alternative', $.else_if_statement)),
			optional(field('alternative', $.else_statement)),
			'end', 'if',
		),
		else_if_statement: $ => seq(
			choice('else if', 'elseif'),
			field('condition', $.expression),
			optional('then'),
			optional(field('consequence', $._block)),
		),
		else_statement: $ => seq(
			'else',
			optional(field('consequence', $._block)),
		),

		while_statement: $ => seq(
			'while',
			field('condition', $.expression),
			optional('do'),
			optional(field('body', $._block)),
			'end', 'while',
		),

		try_statement: $ => seq(
			'try',
			/\n/,
			optional(field('block', $._block)),
			optional(field('catch', $.catch_clause)),
			'end try',
		),
		catch_clause: $ => seq(
			'catch',
			optional($.variable),
			optional(field('block', $._block)),
		),

		exit_statement: () => seq('exit', choice('for', 'while')),
		goto_statement: $ => seq('goto', field('name', $.identifier)),
		return_statement: $ => prec.left(1, seq('return', optional($.expression_list))),

		expression: $ => choice(
			$.invalid,
			$.false,
			$.true,
			$.number,
			$.string,
			$.variable,
			$.prefix_expression,
			$.associative_array,
			$.unary_expression,
			$.binary_expression,
		),

		expression_list: $ => _list($.expression, ','),
		prefix_expression: $ => choice($.variable, $.function_call, $.parenthesized_expression),
		_prefix_expression: $ => prec(1, $.prefix_expression),

		variable: $ => choice($.identifier, $.bracket_index_expression, $.dot_index_expression),

		bracket_index_expression: $ => seq(
			field('table', $._prefix_expression),
			'[',
			field('field', $.expression),
			']',
		),

		dot_index_expression: $ => seq(
			field('table', $._prefix_expression),
			choice('.', field('optional_chain', $.optional_chain)),
			field('field', $.identifier),
		),

		binary_expression: $ => choice(
			...[
				['or', PREC.OR],
				['and', PREC.AND],
				['=', PREC.COMP],
				['<>', PREC.COMP],
				['<', PREC.COMP],
				['>', PREC.COMP],
				['<=', PREC.COMP],
				['>=', PREC.COMP],
				['+', PREC.ADD],
				['-', PREC.ADD],
				['*', PREC.MULT],
				['/', PREC.MULT],
				['mod', PREC.MULT],
			].map(([operator, priority]) => prec.left(priority,
				seq(
					field('left', $.expression),
					field('operator', operator),
					field('right', $.expression),
				),
			)),
		),

		unary_expression: $ => choice(
			...['not', '#', '-', '~'].map((operator) =>
				prec.left(
					PREC.UNARY,
					seq(field('operator', operator), field('argument', $.expression)),
				),
			),
		),

		associative_array: $ => seq('{', optional($.field_list), '}'),
		// Fields may be separated by commas, by newlines, or both.
		field_list: $ => seq(
			$.field,
			repeat(seq(optional(','), $.field)),
			optional(','),
		),
		field: $ => seq(
			field('key', choice($.identifier, $.string)),
			':',
			field('value', $.expression),
		),
		optional_chain: _ => '?.',

		parenthesized_expression: $ => seq('(', $.expression, ')'),

		number: $ => token(seq(
			optional('-'),
			choice(
				seq(/&[hH]/, repeat1(/[0-9a-fA-F]/)),
				seq(_numeral(DECIMAL_DIGIT), optional(seq(
					/[eE]/,
					optional(/[+-]/),
					repeat1(DECIMAL_DIGIT),
				))),
			),
		)),

		identifier: (_) => {
			const identifier_start =
				/[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.?\\'"\d]/;
			const identifier_continue =
				/[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.?\\'"]*/;
			return token(seq(identifier_start, identifier_continue));
		},

		true: () => 'true',
		false: () => 'false',
		invalid: () => 'invalid',
		// A comment runs from its marker to the end of the line; the newline
		// itself is consumed as whitespace so a comment may end the file.
		// `rem` requires a following separator so words like `removeItem`
		// keep parsing as identifiers.
		comment: $ => token(choice(
			seq("'", /[^\n]*/),
			seq(/[rR][eE][mM]/, choice(
				/[^a-zA-Z0-9_\n]/,
				seq(/[^a-zA-Z0-9_]/, /[^\n]*/),
				/\n/,
			)),
		)),
		string: $ => /"([^"\n]|"")*"/,
	},

	extras: $ => [WHITESPACE, $.comment],
	conflicts: $ => [
		[$.print_statement],
		[$.label_statement, $.variable],
		[$.statement, $._table_method_variable],
		[$.expression, $._table_method_variable],
		[$._inline_block],
	],
	inline: $ => [$.prefix_expression],
	supertypes: $ => [$.statement, $.expression, $.variable],
	word: $ => $.identifier,
});

function commaSep1(rule) {
	return seq(rule, repeat(seq(',', rule)));
}
