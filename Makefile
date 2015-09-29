# --- nitro-js

test:
	@$(shell npm bin)/mocha tests

echo:
	@echo "hi all!"

# DEFAULT TASKS

.DEFAULT_GOAL := echo
