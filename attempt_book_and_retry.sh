#!/bin/bash
echo "script started"
# Maximum number of attempts
max_attempts=3
attempt=0

npm_dir="/Users/j2/.nvm/versions/node/v20.13.1/bin/npm"
# Command to run
command="$npm_dir run start:today"

# Directory where your npm project is located
# TODO(@user): populate
project_dir="/Users/j2/VisualStudioCode/ez-resy"

# Change to the project directory
cd "$project_dir"

# Run the command and retry upon failure
while [ $attempt -lt $max_attempts ]; do
  echo "Attempt $((attempt+1)) of $max_attempts"
  if $command; then
    echo "Command succeeded."
    break
  else
    echo "Command failed, retrying in 20 seconds..."
    sleep 20
  fi
  attempt=$((attempt+1))
done


