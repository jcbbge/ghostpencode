class Ghostpencode < Formula
  desc "Bi-directional theme sync between Ghostty terminal and OpenCode"
  homepage "https://github.com/jcbbge/ghostpencode"
  url "https://github.com/jcbbge/ghostpencode/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "" # Will be filled after first release
  license "MIT"

  depends_on "bun"

  def install
    # Install all files to libexec
    libexec.install Dir["*"]
    
    # Install dependencies
    cd libexec do
      system "bun", "install", "--production"
    end
    
    # Create wrapper script
    (bin/"ghostpencode").write <<~EOS
      #!/bin/bash
      exec "#{Formula["bun"].opt_bin}/bun" "#{libexec}/src/cli.ts" "$@"
    EOS
  end

  test do
    assert_match "ghostpencode - Theme sync for Ghostty & OpenCode", shell_output("#{bin}/ghostpencode --help")
  end
end

