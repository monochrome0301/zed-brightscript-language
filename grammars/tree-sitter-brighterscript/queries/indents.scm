(_
  "("
  ")" @end) @indent

(_
  "["
  "]" @end) @indent

(_
  "{"
  "}" @end) @indent

(_
  "`"
  "`" @end) @indent

(function_declaration) @start.function

(class_declaration) @start.class

(class_field) @start.class_field

(interface_declaration) @start.interface

(interface_field) @start.interface_field

(interface_method) @start.interface_method

(enum_declaration) @start.enum

(enum_member) @start.enum_member

(namespace_declaration) @start.namespace

(if_statement) @start.if

(else_if_statement) @start.elseif

(else_statement) @start.else

(for_statement) @start.for

(while_statement) @start.while

(try_statement) @start.try

(preproc_if_statement) @start.preproc_if

(preproc_else_if_clause) @start.preproc_elseif

(preproc_else_clause) @start.preproc_else
