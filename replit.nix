{ pkgs }: {
    deps = [
		pkgs.gnupg
  pkgs.nodePackages.prettier
        # pkgs.telnet
        pkgs.iputils
        pkgs.yarn
        pkgs.esbuild
        pkgs.nodejs-16_x

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}