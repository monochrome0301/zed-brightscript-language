; Keywords
[
  "sub"
  "function"
  "end"
  "if"
  "then"
  "else"
  "elseif"
  "for"
  "each"
  "in"
  "to"
  "step"
  "next"
  "while"
  "do"
  "try"
  "catch"
  "exit"
  "goto"
  "dim"
  "as"
] @keyword

(stop_statement) @keyword

"return" @keyword.return

[
  "try"
  "catch"
] @keyword.exception

[
  "for"
  "while"
  "do"
] @keyword.repeat

[
  "if"
  "then"
  "else"
  "elseif"
] @keyword.conditional

"print" @keyword
"?" @keyword

; Preprocessor directives
[
  "#if"
  "#else if"
  "#else"
  "#end if"
  "#const"
  "#error"
] @keyword.directive

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "="
  "<>"
  "<"
  ">"
  "<="
  ">="
  "mod"
  "and"
  "or"
  "not"
  "~"
] @operator

"#" @operator

(optional_chain) @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
] @punctuation.delimiter

"." @punctuation.delimiter

; Built-in types
(type) @type.builtin

; Literals
(number) @number
(string) @string
[
  (true)
  (false)
] @boolean
(invalid) @constant.builtin

; Comments
(comment) @comment

; Identifiers
(identifier) @variable

((identifier) @variable.builtin
  (#eq? @variable.builtin "m"))

; Function and sub definitions
(function_declaration
  name: (identifier) @function)

; Calls
(function_call
  name: [
    (identifier) @function.call
    (variable) @function.call
  ])

(function_call
  (dot_index_expression
    field: (identifier) @function.call))

; Method call after ':' (obj:method)
(function_call
  ":"
  (identifier) @method.call)

; Fields and properties
(dot_index_expression
  field: (identifier) @field)

(field
  key: (identifier) @property)

(field
  key: (string) @property)

; Parameters
(parameter
  parameterName: (identifier) @parameter)

; Labels
(label_statement
  name: (identifier) @label)
