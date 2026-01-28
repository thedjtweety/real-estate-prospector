import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bell, Loader2, CheckCheck, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Notifications() {
  const { data: notificationsList, isLoading, refetch } = trpc.notifications.getNotifications.useQuery({ limit: 50 });
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification marked as read");
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("All notifications marked as read");
    },
  });

  const sendTestMutation = trpc.notifications.sendTestNotification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Test notification sent!");
      } else {
        toast.error(data.message);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  const unreadCount = notificationsList?.filter(n => !n.read).length || 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-navy-900 flex items-center gap-3">
            <Bell className="h-10 w-10 text-navy-700" />
            Notifications
          </h1>
          <p className="text-navy-600 mt-2">
            Stay updated on high-value prospects and search results
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => sendTestMutation.mutate()}
            disabled={sendTestMutation.isPending}
          >
            {sendTestMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Send Test
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <Card className="border-gold-300 bg-gold-50">
          <CardContent className="py-4">
            <p className="text-navy-900 font-medium">
              You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {!notificationsList || notificationsList.length === 0 ? (
        <Card className="border-navy-200">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">No notifications yet. You will be notified when high-value prospects are discovered!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notificationsList.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? "border-navy-200" : "bg-navy-50 border-navy-300"}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {notification.read ? (
                      <MailOpen className="h-5 w-5 text-navy-400 mt-1 flex-shrink-0" />
                    ) : (
                      <Mail className="h-5 w-5 text-navy-700 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-display">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(notification.createdAt), "PPp")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <Badge className="bg-gold-500">New</Badge>
                    )}
                    {notification.type && (
                      <Badge variant="outline" className="capitalize">
                        {notification.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-navy-700 mb-4">{notification.message}</p>
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate({ notificationId: notification.id })}
                    disabled={markAsReadMutation.isPending}
                  >
                    Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
