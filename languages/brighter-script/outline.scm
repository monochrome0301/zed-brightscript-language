; BrighterScript outline: classes, interfaces, enums, namespaces and the
; classic sub/function declarations. Zed nests items by their source ranges,
; so namespace and class members appear under their parents.

(function_declaration
  [
    "sub"
    "function"
  ] @context
  name: (identifier) @name) @item

(class_declaration
  "class" @context
  name: (identifier) @name) @item

(interface_declaration
  "interface" @context
  name: (identifier) @name) @item

(enum_declaration
  "enum" @context
  name: (identifier) @name) @item

(namespace_declaration
  "namespace" @context
  name: (namespace_name) @name) @item

(const_statement
  "const" @context
  name: (identifier) @name) @item

(enum_member
  name: (identifier) @name) @item

(preproc_const_statement
  "#const" @context
  name: (identifier) @name) @item

(label_statement
  name: (identifier) @name) @item
