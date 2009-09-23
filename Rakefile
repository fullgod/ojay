task :deps do
  pkg = ENV['pkg']
  
  dir = [File.join('source', 'packages', pkg), File.join('source', pkg)].
        find(&File.method(:directory?))
  
  files = Dir.entries(dir).map { |f| File.join(dir, f) }.
          select(&File.method(:file?))
  
  files.map(&File.method(:read)).join("\n").
  scan(/\b(?:YAHOO|Y|lang|util|widget|tool|JS|Ojay)(?:\.[A-Za-z0-9\_\$]+)+(?:\s*=)?/).
  flatten.
  map { |s| s.gsub(/^YAHOO\./, '') }.
  uniq.sort.
  each(&method(:puts))
end

