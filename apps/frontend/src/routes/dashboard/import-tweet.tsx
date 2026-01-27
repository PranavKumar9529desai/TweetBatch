import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDropzone } from 'react-dropzone'
import { Upload, AlertCircle, CheckCircle, X, StickyNote, FileJson } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/ui/button'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@repo/ui/components/ui/card'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { Badge } from '@repo/ui/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { apiclient } from '@/lib/api.client'
import { Title } from "@/components/title"

export const Route = createFileRoute('/dashboard/import-tweet')({
  component: ImportTweetPage,
})

interface TweetDraft {
  content: string
  scheduledAt: string
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

function validateTweet(tweet: any): ValidationResult {
  if (!tweet.content || typeof tweet.content !== 'string') {
    return { isValid: false, error: 'Missing or invalid content' }
  }
  if (tweet.content.length > 280) {
    return { isValid: false, error: 'Content exceeds 280 characters' }
  }
  if (!tweet.scheduledAt || typeof tweet.scheduledAt !== 'string') {
    return { isValid: false, error: 'Missing or invalid scheduledAt' }
  }
  const date = new Date(tweet.scheduledAt)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  if (date <= new Date()) {
    return { isValid: false, error: 'Scheduled time must be in the future' }
  }
  return { isValid: true }
}

function ImportTweetPage() {
  const { auth } = Route.useRouteContext()
  const user = auth.user
  const [jsonInput, setJsonInput] = useState('')
  const [parsedTweets, setParsedTweets] = useState<(TweetDraft & { validation: ValidationResult })[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [activeTab, setActiveTab] = useState("file")

  const processJson = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      if (!Array.isArray(parsed)) {
        toast.error('Invalid JSON: Must be an array of objects')
        return
      }

      const processed = parsed.map((t: any) => ({
        content: t.content,
        scheduledAt: t.scheduledAt,
        validation: validateTweet(t)
      }))

      setParsedTweetsAttribute(processed)
    } catch (e) {
      toast.error('Invalid JSON syntax')
    }
  }, [])

  // Helper to set tweets and also update the text area if not already
  const setParsedTweetsAttribute = (tweets: (TweetDraft & { validation: ValidationResult })[]) => {
    setParsedTweets(tweets)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text === 'string') {
        setJsonInput(text)
        processJson(text)
      }
    }
    reader.readAsText(file)
  }, [processJson])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  })

  const handleManualInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJsonInput(value)

    if (value.trim() === '') {
      setParsedTweets([])
      return
    }

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        const processed = parsed.map((t: any) => ({
          content: t.content,
          scheduledAt: t.scheduledAt,
          validation: validateTweet(t)
        }))
        setParsedTweets(processed)
      }
    } catch {
      // partial json, ignore
    }
  }

  const handleImport = async () => {
    if (!user) {
      toast.error("You must be logged in to import tweets")
      return
    }

    const validTweets = parsedTweets.filter(t => t.validation.isValid)
    if (validTweets.length === 0) {
      toast.error("No valid tweets to import")
      return
    }

    setIsImporting(true)
    try {
      const res = await apiclient.posts['bulk-import'].$post({
        json: {
          userId: user.id,
          posts: validTweets.map(t => ({
            content: t.content,
            scheduledAt: t.scheduledAt
          }))
        }
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`Successfully imported ${data.imported} tweets`)
        setJsonInput('')
        setParsedTweets([])
      } else {
        if ('error' in data) {
          toast.error(data.error || 'Failed to import tweets')
          if ('violations' in data && data.violations) {
            console.error(data.violations)
          }
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred during import')
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = parsedTweets.filter(t => t.validation.isValid).length
  const invalidCount = parsedTweets.length - validCount

  return (
    <div className="flex flex-col container mx-auto p-4 lg:py-10 max-w-[100rem] pb-32">
      <div className="flex-1 flex flex-col gap-6 w-full max-w-4xl mx-auto">
        <div className="w-full justify-center text-center sm:text-left p-2">
          <Title title="Import Tweets" subtitle="Bulk import scheduled tweets from a JSON file." />
        </div>

        <div className="flex flex-col gap-8">
          <Card variant="borderless" className="w-full">
            <CardHeader className="px-0 pt-0">
              <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="file" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                      <FileJson className="h-4 w-4" />
                      JSON File
                    </TabsTrigger>
                    <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                      <StickyNote className="h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>
                  {(validCount > 0 || invalidCount > 0) && (
                    <div className="flex gap-2">
                      {validCount > 0 && <Badge variant="secondary" className="h-7 px-3">{validCount} Valid</Badge>}
                      {invalidCount > 0 && <Badge variant="destructive" className="h-7 px-3">{invalidCount} Invalid</Badge>}
                    </div>
                  )}
                </div>

                <TabsContent value="file" className="mt-0">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ease-in-out hover:bg-muted/30 hover:border-primary/50",
                      isDragActive ? "border-primary bg-muted/30 scale-[1.01]" : "border-muted-foreground/20"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className={cn("p-4 rounded-full transition-colors", isDragActive ? "bg-primary/10" : "bg-muted")}>
                        <Upload className={cn("h-8 w-8", isDragActive ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      {isDragActive ? (
                        <div className="space-y-1">
                          <p className="text-lg font-medium text-primary">Drop the JSON file here</p>
                          <p className="text-sm text-muted-foreground">Release to upload</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-lg font-medium">Drag & drop a JSON file</p>
                          <p className="text-sm text-muted-foreground">or click to browse your files</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-0">
                  <Textarea
                    placeholder='[{"content": "Hello World", "scheduledAt": "2024-01-01T12:00:00Z"}]'
                    className="font-mono text-sm min-h-[300px] resize-y p-6 leading-relaxed"
                    value={jsonInput}
                    onChange={handleManualInputChange}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>

            {parsedTweets.length > 0 && (
              <CardContent className="px-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">Preview</h3>
                </div>
                <ScrollArea className="h-[400px] rounded-xl border bg-muted/10 p-4">
                  <div className="space-y-3">
                    {parsedTweets.map((tweet, i) => (
                      <div key={i} className={cn(
                        "p-4 rounded-lg border transition-all hover:shadow-sm",
                        tweet.validation.isValid
                          ? "bg-card border-border/50"
                          : "bg-destructive/5 border-destructive/20"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <p className="font-medium text-sm leading-relaxed">{tweet.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase">Scheduled</span>
                              <span>{tweet.scheduledAt}</span>
                            </div>
                          </div>
                          {tweet.validation.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        {!tweet.validation.isValid && (
                          <div className="mt-3 pt-2 border-t border-destructive/10">
                            <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                              <X className="h-3 w-3" />
                              {tweet.validation.error}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px]"
                    disabled={validCount === 0 || isImporting}
                    onClick={handleImport}
                  >
                    {isImporting ? "Importing..." : `Import ${validCount} Tweets`}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
