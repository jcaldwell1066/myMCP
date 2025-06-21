#!/bin/bash
# myMCP Shell Aliases Installation Script

echo "🎮 myMCP Shell Aliases Installer"
echo "================================"
echo

# Detect shell configuration file
if [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
else
    echo "❌ Could not find shell configuration file"
    echo "   Please manually add the source command to your shell config"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MYMCP_HOME="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📍 Detected myMCP location: $MYMCP_HOME"
echo "📄 Shell config file: $SHELL_CONFIG"
echo

# Check if already installed
if grep -q "mymcp-aliases.sh" "$SHELL_CONFIG" 2>/dev/null; then
    echo "⚠️  myMCP aliases appear to already be installed"
    echo "   Check your $SHELL_CONFIG file"
    exit 0
fi

# Add to shell config
echo "📝 Adding myMCP aliases to $SHELL_CONFIG..."
cat >> "$SHELL_CONFIG" << EOF

# myMCP Shell Aliases
export MYMCP_HOME="$MYMCP_HOME"
if [ -f "\$MYMCP_HOME/tools/shell/mymcp-aliases.sh" ]; then
    source "\$MYMCP_HOME/tools/shell/mymcp-aliases.sh"
fi
EOF

echo "✅ Installation complete!"
echo
echo "🔄 To activate the aliases now, run:"
echo "   source $SHELL_CONFIG"
echo
echo "📚 Or restart your terminal"
echo
echo "ℹ️  Type 'mcp-help' to see available commands" 