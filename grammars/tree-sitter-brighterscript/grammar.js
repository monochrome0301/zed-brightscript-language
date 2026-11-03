/**
 * BrighterScript grammar for tree-sitter.
 *
 * BrighterScript (rokucommunity/brighterscript) is a superset of
 * BrightScript. This grammar mirrors the vendored brightscript grammar and
 * adds classes, interfaces, enums, namespaces, `import`, `const`, `throw`,
 * annotations, template strings, ternary/null-coalescing/optional-chaining/
 * logical/compound-assignment operators, `new` expressions, `super`, and the
 * extended type syntax (unions, nullable `?`, non-null `!`, function types).
 */
const PREC = {
	DEFAULT: 0,
	TERNARY: 1,
	OR: 2,
	AND: 3,
	COMP: 4,
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
	name: 'brighterscript',

	rules: {
		source_file: $ => $._block,

		_block: $ => choice(
			seq(repeat1($._statement), optional($.return_statement)),
			seq(repeat($._statement), $.return_statement),
		),

		_statement: $ => choice(
			$.statement,
			$.import_statement,
			$.annotation,
		),

		statement: $ => choice(
			$.assignment_statement,
			$.typed_declaration_statement,
			$.const_statement,
			$.throw_statement,
			$.function_call,
			$.goto_statement,
			$.exit_statement,
			$.while_statement,
			$.if_statement,
			$.inline_if_statement,
			$.for_statement,
			$.try_statement,
			$.function_declaration,
			$.class_declaration,
			$.interface_declaration,
			$.enum_declaration,
			$.namespace_declaration,
			$.print_statement,
			$.dim_statement,
			$.stop_statement,
			$.label_statement,
			$.preproc_if_statement,
			$.preproc_const_statement,
			$.preproc_error_statement,
		),

		// @annotation / @annotation(args) before functions, classes and
		// namespaces.
		annotation: $ => seq(
			'@',
			field('name', $.identifier),
			optional(field('arguments', $.argument_list)),
		),

		import_statement: $ => seq(
			'import',
			field('path', $.string),
		),

		const_statement: $ => seq(
			'const',
			field('name', $.identifier),
			'=',
			field('value', $.expression),
		),

		throw_statement: $ => seq(
			'throw',
			$.expression,
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

		// Typed variable declarations: `name as type` or
		// `name as type = value`.
		typed_declaration_statement: $ => prec.right(seq(
			field('name', $.identifier),
			'as',
			field('type', $.type),
			optional(seq('=', field('value', $.expression_list))),
		)),

		// #if / #else if / #else / #end if preprocessor blocks, #const and
		// #error. The condition is any expression evaluated at compile time
		// (typically a #const identifier).
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

		class_declaration: $ => seq(
			'class',
			field('name', $.identifier),
			optional(seq('extends', field('superclass', $.type))),
			optional(field('body', $.class_body)),
			'end class',
		),
		class_body: $ => repeat1(choice(
			$.class_field,
			$.function_declaration,
			$.annotation,
		)),
		class_field: $ => seq(
			optional(field('access_modifier', choice('public', 'protected', 'private'))),
			field('name', $.identifier),
			optional(seq('as', field('type', $.type))),
			optional(seq('=', field('value', $.expression))),
		),

		interface_declaration: $ => seq(
			'interface',
			field('name', $.identifier),
			optional(seq('extends', field('superinterfaces', commaSep1($.type)))),
			optional(field('body', $.interface_body)),
			'end interface',
		),
		interface_body: $ => repeat1(choice(
			$.interface_field,
			$.interface_method,
		)),
		interface_field: $ => seq(
			field('name', $.identifier),
			'as',
			field('type', $.type),
		),
		interface_method: $ => seq(
			choice('sub', 'function'),
			field('name', $.identifier),
			'(',
			optional(commaSep1($.parameter)),
			')',
			optional(seq('as', $.type)),
		),

		enum_declaration: $ => seq(
			'enum',
			field('name', $.identifier),
			optional(seq('as', field('type', $.type))),
			optional(field('body', $.enum_body)),
			'end enum',
		),
		enum_body: $ => repeat1($.enum_member),
		enum_member: $ => seq(
			field('name', $.identifier),
			optional(seq('=', field('value', $.expression))),
		),

		namespace_declaration: $ => seq(
			'namespace',
			field('name', $.namespace_name),
			optional(field('body', $._block)),
			'end namespace',
		),
		namespace_name: $ => seq(
			$.identifier,
			repeat(seq('.', $.identifier)),
		),

		function_declaration: $ => choice(
			seq(
				optional(field('access_modifier', choice('public', 'protected', 'private'))),
				optional('override'),
				'sub',
				field('name', $.identifier),
				'(',
				optional(field('parameters', optional(commaSep1($.parameter)))),
				')',
				optional(field('body', $._block)),
				'end sub',
			),
			seq(
				optional(field('access_modifier', choice('public', 'protected', 'private'))),
				optional('override'),
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
			$._type_atom,
			$.union_type,
		),
		_type_atom: $ => seq(
			choice(
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
				'void',
				'function',
				'any',
				$.type_reference,
				$.function_type,
			),
			repeat(choice('?', '!')),
		),
		type_reference: $ => seq(
			$.identifier,
			repeat(seq('.', $.identifier)),
		),
		function_type: $ => seq(
			'function',
			'(',
			optional(commaSep1($.parameter)),
			')',
			optional(seq('as', $.type)),
		),
		union_type: $ => seq(
			$._type_atom,
			repeat1(seq('|', $._type_atom)),
		),

		assignment_statement: $ => seq(
			$.variable,
			field('operator', choice('=', '+=', '-=', '*=', '/=')),
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
			$.template_string,
			$.variable,
			$.prefix_expression,
			$.associative_array,
			$.unary_expression,
			$.binary_expression,
			$.ternary_expression,
			$.new_expression,
			$.super_expression,
		),

		expression_list: $ => _list($.expression, ','),
		prefix_expression: $ => choice($.variable, $.function_call, $.parenthesized_expression),
		_prefix_expression: $ => prec(1, $.prefix_expression),

		// new ClassName(args)
		new_expression: $ => seq(
			'new',
			field('class', $.type_reference),
			field('arguments', $.argument_list),
		),

		// super(args) or super.member
		super_expression: $ => prec.left(seq(
			'super',
			choice(
				field('arguments', $.argument_list),
				seq('.', field('member', $.identifier), optional(field('arguments', $.argument_list))),
			),
		)),

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

		ternary_expression: $ => prec.right(PREC.TERNARY, seq(
			field('condition', $.expression),
			'?',
			field('consequence', $.expression),
			':',
			field('alternative', $.expression),
		)),

		binary_expression: $ => choice(
			...[
				['||', PREC.OR],
				['or', PREC.OR],
				['&&', PREC.AND],
				['and', PREC.AND],
				['??', PREC.OR],
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

		// Template strings: `text ${expression} more`
		template_string: $ => seq(
			'`',
			repeat(choice(
				$._template_content,
				$.template_interpolation,
			)),
			'`',
		),
		_template_content: _ => token(prec(-1, /[^`$]+|\$/)),
		template_interpolation: $ => seq(
			'${',
			$.expression,
			'}',
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
				/[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.?\\'"`@\d]/;
			const identifier_continue =
				/[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.?\\'"`@\d]*/;
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
	inline: $ => [$.prefix_expression],
	supertypes: $ => [$.statement, $.expression, $.variable],
	word: $ => $.identifier,

	conflicts: $ => [
		[$.annotation],
		[$._type_atom],
		[$._type_atom, $.function_type],
		[$.type, $.union_type],
		[$.union_type],
		[$.print_statement],
		[$.label_statement, $.variable],
		[$.statement, $._table_method_variable],
		[$.expression, $._table_method_variable],
		[$._inline_block],
		// ternary `?` vs `??`/optional chains, and `:` in ternary vs labels
		[$.ternary_expression, $.expression],
		[$.ternary_expression, $.label_statement],
		// `a as T = v` vs expression starting with identifier
		[$.typed_declaration_statement, $.variable, $.statement],
		// namespace member access `a.b` vs namespace_name in declarations
		[$.type_reference, $.variable],
		// `super` usage
		[$.super_expression, $.expression],
		// class field with `name = value` vs statement
		[$.class_field, $.statement],
		// interface field/method
		[$.interface_field, $.interface_method],
		// function type vs function call in type position
		[$.function_type, $.expression],
	],
});

function commaSep1(rule) {
	return seq(rule, repeat(seq(',', rule)));
}
