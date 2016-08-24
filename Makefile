# --- nitro-js

install:
	npm install || true

test: install
	@$(shell npm bin)/mocha tests

echo:
	@echo "hi all!"

# DEFAULT TASKS

.DEFAULT_GOAL := echo
