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
  "throw"
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

[
  "class"
  "interface"
  "enum"
  "namespace"
  "extends"
  "import"
  "const"
] @keyword

"new" @keyword.constructor
"super" @keyword

[
  "public"
  "protected"
  "private"
  "override"
] @keyword.modifier

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
  "&&"
  "||"
  "??"
  "+="
  "-="
  "*="
  "/="
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

; Annotations (@annotation before functions/classes)
(annotation
  "@" @attribute
  name: (identifier) @attribute)

; Types
(type
  [
    "boolean"
    "bool"
    "integer"
    "longInteger"
    "long"
    "float"
    "double"
    "string"
    "object"
    "interface"
    "dynamic"
    "void"
    "function"
    "any"
  ] @type.builtin)

(type
  [
    "?"
    "!"
  ] @operator)

(type_reference
  (identifier) @type)

(type_reference
  "." @punctuation.delimiter
  (identifier) @type)

(function_type
  "function" @type.builtin)

; Class declarations: the class name itself is a type
(class_declaration
  name: (identifier) @type)

(class_declaration
  superclass: (type
    (type_reference
      (identifier) @type)))

(enum_declaration
  name: (identifier) @type)

(interface_declaration
  name: (identifier) @type)

; Literals
(number) @number
(string) @string
(template_string) @string
(template_interpolation
  "${" @punctuation.special
  "}" @punctuation.special)

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

; Constructors
(function_declaration
  name: (identifier) @constructor
  (#eq? @constructor "new"))

; Calls
(function_call
  name: [
    (identifier) @function.call
    (variable) @function.call
  ])

(function_call
  (dot_index_expression
    field: (identifier) @function.call))

(function_call
  ":" (identifier) @method.call)

; Fields and properties
(dot_index_expression
  field: (identifier) @field)

(field
  key: (identifier) @property)

(field
  key: (string) @property)

(class_field
  name: (identifier) @field)

(interface_field
  name: (identifier) @field)

(enum_member
  name: (identifier) @constant)

(const_statement
  name: (identifier) @constant)

; Parameters
(parameter
  parameterName: (identifier) @parameter)

; Labels
(label_statement
  name: (identifier) @label)
