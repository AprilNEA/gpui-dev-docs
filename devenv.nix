{ pkgs, ... }:
{
  packages = [ pkgs.git ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    corepack.enable = true;
    pnpm.enable = true;
  };

  processes = {
    docs.exec = "pnpm dev";
  };
}
