# Operator Overloading TypeScript Fork

## Installation

```sh
npm install -D typescript@npm:@operated/typescript
```
And for VS Code:
- Ctrl/⌘+Shift+P
- Open Settings
- Type in Search "typescript tsdk"
- Put path `{your_project}/node_modules/typescript/lib/`
- Restart VS Code

## Usage

When operators are run on objects, TypeScript checks whether there is a method to call, instead of an operator. In final JS, it would look like an object method was called. (`a + b` => `a.plus(b)`)

Along with a compiler, "Go To Definition" feature was supported for IDE: click on an operator between the objects to jump to method, that will be invoked.

| Operator | Method Name |
|----|----|
| +, +=  | plus |
| -, -=  | minus |
| *, *=  | times |
| /, /=  | div, invDiv* |
| %, %=  | rem |
| ^. ^=  | pow |
| ==, != | equals |
| ===, !== | exactEquals |
| a() | run |

_* — `invDiv` is inverted division, needed when divided type is not an object. For example, `2 / vec2(1, 0)` will result in `vec2(1, 0).invDiv(2)`_