FROM structurizr/lite:latest

# Install structurizr CLI on top of Lite

ARG STRUCTURIZR_CLI_VERSION=1.33.1

RUN apt-get update && apt-get install -y bash curl unzip
RUN curl -L -o /tmp/structurizr-cli.zip "https://github.com/structurizr/cli/releases/download/v$STRUCTURIZR_CLI_VERSION/structurizr-cli-$STRUCTURIZR_CLI_VERSION.zip" && unzip "/tmp/structurizr-cli.zip" -d /usr/local/bin

RUN apt-get update && apt-get install -y libc6-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install JRuby for REPL

ENV JRUBY_VERSION 9.4.3.0
ENV JRUBY_SHA256 b097e08c5669e8a188288e113911d12b4ad2bd67a2c209d6dfa8445d63a4d8c9

RUN mkdir /opt/jruby \
  && curl -fSL https://repo1.maven.org/maven2/org/jruby/jruby-dist/${JRUBY_VERSION}/jruby-dist-${JRUBY_VERSION}-bin.tar.gz -o /tmp/jruby.tar.gz \
  && echo "$JRUBY_SHA256 /tmp/jruby.tar.gz" | sha256sum -c - \
  && tar -zx --strip-components=1 -f /tmp/jruby.tar.gz -C /opt/jruby \
  && rm /tmp/jruby.tar.gz \
  && update-alternatives --install /usr/local/bin/ruby ruby /opt/jruby/bin/jruby 1
ENV PATH /opt/jruby/bin:$PATH

# skip installing gem documentation
RUN mkdir -p /opt/jruby/etc \
	&& { \
		echo 'install: --no-document'; \
		echo 'update: --no-document'; \
	} >> /opt/jruby/etc/gemrc

RUN gem install bundler rake net-telnet xmlrpc

# don't create ".bundle" in all our apps
ENV GEM_HOME /usr/local/bundle
ENV BUNDLE_SILENCE_ROOT_WARNING=1 \
	BUNDLE_APP_CONFIG="$GEM_HOME"
ENV PATH $GEM_HOME/bin:$PATH
# adjust permissions of a few directories for running "gem install" as an arbitrary user
RUN mkdir -p "$GEM_HOME" && chmod 777 "$GEM_HOME"

# Install REPL

ARG STRUCTURIZR_GEM_VERSION=1.26.1
RUN jruby -S gem install structurizr -v $STRUCTURIZR_GEM_VERSION

RUN apt-get update && apt-get install adr-tools

WORKDIR /usr/local/structurizr
