import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MapPin } from "lucide-react";
import { format } from "date-fns";

interface EventItemProps {
  event: Event;
}

function EventItem({ event }: EventItemProps) {
  const eventDate = new Date(event.date);
  const month = format(eventDate, 'MMM').toUpperCase();
  const day = format(eventDate, 'd');
  const time = format(eventDate, 'h:mm a') + (event.endDate ? ` - ${format(new Date(event.endDate), 'h:mm a')}` : '');

  const getBgColor = (index: number) => {
    const colors = ["bg-primary", "bg-accent", "bg-secondary"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex items-start p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
      <div className={`flex flex-col items-center justify-center ${getBgColor(event.id)} text-white rounded-lg min-w-14 h-14 mr-3`}>
        <span className="text-xs">{month}</span>
        <span className="text-xl font-bold">{day}</span>
      </div>
      <div>
        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-slate-500">{time}</p>
        {event.location && (
          <div className="flex items-center mt-1">
            <span className="text-xs text-slate-600 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {event.location}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpcomingEvents() {
  // Fetch upcoming events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start p-3 rounded-lg bg-slate-50">
                <Skeleton className="rounded-lg w-14 h-14 mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/4 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No upcoming events</p>
          </div>
        )}

        <div className="mt-4 text-center pt-3 border-t border-slate-100">
          <a href="#" className="text-primary text-sm font-medium hover:underline">View All Events</a>
        </div>
      </CardContent>
    </Card>
  );
}
