(function_declaration
  [
    "sub"
    "function"
  ] @context
  name: (identifier) @name) @item

(preproc_const_statement
  "#const" @context
  name: (identifier) @name) @item

(label_statement
  name: (identifier) @name) @item
