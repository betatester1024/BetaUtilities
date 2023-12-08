{ pkgs }: {
    deps = [
      pkgs.nano
      pkgs.nodejs
		pkgs.gnupg
  pkgs.nodePackages.prettier
        # pkgs.telnet
        pkgs.iputils
        pkgs.yarn
        pkgs.esbuild
        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}