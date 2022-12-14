FROM structurizr/lite:latest

# Install structurizr CLI on top of Lite

ARG STRUCTURIZR_CLI_VERSION=1.20.0

RUN apt-get update && apt-get install -y bash curl unzip
RUN curl -L -o /tmp/structurizr-cli.zip "https://github.com/structurizr/cli/releases/download/v$STRUCTURIZR_CLI_VERSION/structurizr-cli-$STRUCTURIZR_CLI_VERSION.zip" && unzip "/tmp/structurizr-cli.zip" -d /usr/local/bin

RUN apt-get update && apt-get install -y libc6-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install JRuby for REPL

ENV JRUBY_VERSION 9.3.7.0
ENV JRUBY_SHA256 94a7a8b3beeac2253a8876e73adfac6bececb2b54d2ddfa68f245dc81967d0c1

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

ARG STRUCTURIZR_GEM_VERSION=1.0.0.rc.2

RUN jruby -S gem install structurizr -v $STRUCTURIZR_GEM_VERSION

#

WORKDIR /usr/local/structurizr
