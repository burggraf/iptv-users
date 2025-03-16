#!/bin/bash

# Start Pocketbase in the background
echo "Starting Pocketbase server..."
cd pocketbase && ./pocketbase serve &
POCKETBASE_PID=$!

# Start the SvelteKit development server
echo "Starting SvelteKit development server..."
cd "$(dirname "$0")" && bun dev

# When the SvelteKit server is terminated, also terminate Pocketbase
trap "kill $POCKETBASE_PID" EXIT

wait
