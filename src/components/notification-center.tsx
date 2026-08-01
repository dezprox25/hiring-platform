import { useState, useEffect } from "react";
import { Bell, Check, Trash2, CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning" | "ai";
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "AI Evaluation Ready",
    message: "Candidate Aarav Sharma's full-stack assessment has been analyzed by AI (88% compatibility).",
    timestamp: "10m ago",
    read: false,
    type: "ai",
  },
  {
    id: "notif-2",
    title: "New Candidate Submission",
    message: "Sarah Jenkins completed the Frontend Engineering round 1 challenge.",
    timestamp: "45m ago",
    read: false,
    type: "success",
  },
  {
    id: "notif-3",
    title: "Interview Scheduled",
    message: "Video room generated for Technical Deep Dive tomorrow at 2:00 PM EST.",
    timestamp: "3h ago",
    read: false,
    type: "info",
  },
  {
    id: "notif-4",
    title: "Question Bank Notice",
    message: "3 new algorithmic challenges were published to the public assessment roster.",
    timestamp: "1d ago",
    read: true,
    type: "info",
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dezprox_notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed parsing notifications", e);
      }
    }
    setNotifications(DEFAULT_NOTIFICATIONS);
  }, []);

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem("dezprox_notifications", JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
    toast.success("All notifications marked as read");
  };

  const toggleRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
    saveNotifications(updated);
  };

  const deleteNotif = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
    toast.info("Notification removed");
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ai":
        return <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg hover:bg-muted/60">
          <Bell className="h-4 w-4 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 md:w-96 p-0 rounded-2xl border-border/80 shadow-elegant overflow-hidden bg-card text-card-foreground z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full bg-primary/15 text-primary font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary font-bold transition-colors"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 p-2 border-b border-border/40 bg-muted/10">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="h-7 px-3 text-xs rounded-lg font-bold"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
            className="h-7 px-3 text-xs rounded-lg font-bold"
          >
            Unread ({unreadCount})
          </Button>
        </div>

        <ScrollArea className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 opacity-30" />
              <span>No {filter === "unread" ? "unread " : ""}notifications to display</span>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/30 ${
                    !item.read ? "bg-primary/[0.04]" : ""
                  }`}
                >
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!item.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => toggleRead(item.id)}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        {item.read ? "Mark unread" : "Mark as read"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteNotif(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-muted"
                    title="Dismiss notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
