; Basic XML highlighting for SceneGraph components

(STag
  "<" @punctuation.bracket
  (Name) @tag)

(ETag
  "</" @punctuation.bracket
  (Name) @tag
  ">" @punctuation.bracket)

(EmptyElemTag
  "<" @punctuation.bracket
  (Name) @tag
  "/>" @punctuation.bracket)

(Attribute
  (Name) @attribute)

(AttValue) @string

(PseudoAttValue) @string

(Comment) @comment

(CDSect
  (CDStart) @punctuation.bracket
  "]]>" @punctuation.bracket)

(XMLDecl
  "<?" @punctuation.bracket
  "xml" @keyword
  "?>" @punctuation.bracket)

(PI
  "<?" @punctuation.bracket
  "?>" @punctuation.bracket)
