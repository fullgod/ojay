require 'fileutils'

spec = Oyster.spec do
  string :version
end

jake_helper :version do
  begin
    opts = spec.parse(options[:unclaimed])
    return opts[:version] if opts[:version]
    branch = `git branch`.split(/\n/).find { |line| line =~ /^\*/ }[2..-1]
    commit = `git log`.split(/\n/).first.scan(/[0-9a-f]{40}/).flatten.first
    return "#{branch}-#{commit}"
  rescue
    return "not-under-version-control"
  end
end

jake_hook :build_complete do |build|
  %w(README LICENSE CHANGELOG).each do |doc|
    FileUtils.copy doc, "#{ build.build_directory }/../#{ doc }"
  end
  
  FileUtils.mkdir_p 'site/site/javascripts/ojay'
  
  all = build.package(:all)
  
  FileUtils.copy all.build_path(:min), 'site/site/javascripts/ojay/all-min.js'
  FileUtils.copy all.build_path(:source), 'site/site/javascripts/ojay/all.js'
  
  FileUtils.copy 'site/site/javascripts/yui/2.7.0.js', "#{ build.build_directory }/../yui.js"
end

