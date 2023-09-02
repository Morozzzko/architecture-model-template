# Architecture model template

This is a template repo for architecture modelling.

Current tooling is heavily based on [Structurizr](https://structurizr.com/) and is basically a compilation of different tools for improved ergonomics and an easier bootstrapping experience.

Here's the description of the setup:

[DIP](https://github.com/bibendi/dip) is the tool of choice for interacting with workspace. We're running Docker with Compose. DIP facilitates and unifies interactions.

[Structurizr Lite](https://structurizr.com/help/lite) for previewing, editing and interacting with workspace through browser. It's by far the most complex tool for the C4 model, and we're including it by default. Run `dip lite` to start it.

[Structurizr CLI](https://github.com/structurizr/cli) for exporting, publishing, workspace validation, and some other automation. Sometimes it's just more handy than running `Lite`. Run `dip cli` to interact with CLI. Alternatively, run `dip validate` to validate the workspace, or `dip export` to export the workspace.

[structurizr-ruby](https://github.com/Morozzzko/structurizr-ruby) for JRuby [scripting](https://github.com/structurizr/dsl/blob/master/docs/language-reference.md#scripts) and interactive REPL for querying workspace. Run `dip repl` to open a REPL session

![REPL demo session](.github/pics/demo.gif)

## Installation

1. Install `dip` using their [instructions](https://github.com/bibendi/dip#installation)
2. Run `dip build` to build Docker image with Structurizr Lite, CLI and REPL.
3. That's all. Run `dip repl`, `dip cli` or `dip lite` to interact

## Usage

The main expectation is that you'd use this repo as a template for your workspaces and models. Feel free to fork and modify this repo to fit your own needs.

Right now the most sigificant parts of the model look like this:

```
.
├── docs
│   └── 01-test.md
│   ├── .keep
├── output
│   ├── .keep
├── workspace.dsl
└── workspace.json
```

Basically, what we've got are:

1. Workspace files -- both DSL and JSON files. DSL is supposed to be authored by us, while JSON is supposed to be generated by CLI or Structurizr Lite.
2. `docs` directory for documentation. It contains an example of embedding diagrams.
2. `output` directory for all of the CLI-generated outputs. It's gitignored, so feel free to put anything there

## Upload to Structurizr

If you'd like to upload your workspace, you can use `dip cli` to access Structurizr CLI.

There's also a shortcut to upload the workspace – `dip push`. It'll get data from your env and upload the workspace. Here's what you need to provide to env:

* `STRUCTURIZR_WORKSPACE_ID` — workspace ID, what you'd put under `-id ...` in CLI
* `STRUCTURIZR_WORKSPACE_KEY` — workspace key, `-key ...`
* `STRUCTURIZR_WORKSPACE_SECRET` — workspace secret, `-secret ...`
* `STRUCTURIZR_URL` — structurizr instance URL, `-url https:/..`
    
If you don't want to handle env yourself, feel free to create `dip.override.yml` with the contents:

```yml
# dip.override.yml
environment:
  STRUCTURIZR_WORKSPACE_ID: 123
  STRUCTURIZR_WORKSPACE_KEY: key
  STRUCTURIZR_WORKSPACE_SECRET: key
  STRUCTURIZR_URL: https://api.structurizr.com
```

Don't forget to supply your values!

## License and considerations

This code is licensed under the [MIT license](LICENSE).

However, this repository distributes and incorporates other people's works.

### arc42

This repository contains a derivative of [arc42](https://arc42.org/download#file-based-formats) 8.0 at `docs/arc42`

Modifications:

* Removed images, config and root file
* `src` directory is now `arc42`

This content is licensed under [Creative Commons Attribution-ShareAlike 4.0 International License.](https://github.com/arc42/arc42-template/blob/master/LICENSE.txt)

### JRuby docker image

Dockerfile contains code from JRuby's official Docker image. It is licensed under MIT. You can see the copyright at [JRuby Docker repo](https://github.com/jruby/docker-jruby/blob/master/LICENSE.md).
