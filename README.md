# Battle Ramps

A browser-playable prototype. GitHub Actions reconstructs the compressed HTML bundle and deploys it to GitHub Pages.

## Play

After the **Deploy Battle Ramps Pages** workflow completes successfully, open:

https://simonbosboom-nl.github.io/BattleRamp/

No manual download is needed. Open the link in Safari or Chrome. For the best live 3D renderer, use a browser with WebGL enabled.

## Deployment

Workflow: `.github/workflows/pages.yml`

The build reassembles the `bundle/part-*.b64` source fragments into `_site/index.html`, verifies key elements, and deploys the result using GitHub Pages.
