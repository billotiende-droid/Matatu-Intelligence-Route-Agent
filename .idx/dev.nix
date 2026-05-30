{ pkgs, ... }: {
  packages = [
    pkgs.nodejs_20
  ];

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [ "npm" "run" "dev" "--" "--host" "0.0.0.0" ];
        manager = "web";
      };
    };
  };
}
