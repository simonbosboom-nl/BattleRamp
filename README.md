# Battle Ramps

Browser-playable prototype published with GitHub Pages.

## Play

Open https://simonbosboom-nl.github.io/BattleRamp/

The start screen has a two-step setup: choose **Start wedstrijd**, select a car, review team sizes, then press the button showing **START MET [AUTO]** to start the match. No manual downloading is needed.

## Deployment

GitHub Actions copies `index.html`, reconstructs the optimized stadium background from `site-bundle/stadium-*.b64`, and deploys both to Pages. Workflow: `.github/workflows/pages.yml`.

This remains a browser prototype, not a compiled Unreal Engine game. WebGL support affects the 3D renderer; the stadium menu art is a static background illustration.
