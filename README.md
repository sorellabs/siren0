Purr
====

A minimal pure purely object oriented prototypical language.

Hopefully as cute as a kitten :3


## Example

```lisp
| Root |

;; All modules are parametric, there are no globals whatsoever.
;; You need to give each module what they need to work with.
Prelude => Root load: "library/prelude.purr" with: [Root].

;; Main is PURE! You need to give it an IO () thingie.
main => (Prelude True /\ Prelude False)
        then: { apply => Root IO print: "Cool!" }
        else: { apply => Root IO print: "Bleh :(" }
```

## Licence

MIT
