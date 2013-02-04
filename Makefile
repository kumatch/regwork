CWD := $(shell pwd)
LIB := $(CWD)/lib

test:
	mocha --reporter spec --slow 2000 $(CWD)/test/*.test.js

.PHONY: test
