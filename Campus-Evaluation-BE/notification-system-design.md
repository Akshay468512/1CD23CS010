# Notification System Design
# Stage 1
## 1. Main Features

The notification system provides the following functionalities:

- **View Notifications** – Users can see all the notifications they have received.
- **Mark as Read** – A notification can be marked as read once the user has viewed it.
- **Delete Notification** – Users can remove notifications that are no longer needed.
- **Real-Time Updates** – New notifications are delivered instantly without refreshing the page.

---

## 2. API Endpoints

| Function | Method | Endpoint |
|----------|--------|----------|
| Get all notifications | GET | `/api/v1/notifications` |
| Mark a notification as read | PATCH | `/api/v1/notifications/:id` |
| Delete a notification | DELETE | `/api/v1/notifications/:id` |

---

## 3. Real-Time Notification Flow

To make notifications appear instantly, the system uses **WebSockets**.

**How it works:**

1. When the user logs in, the frontend establishes a WebSocket connection with the server.
2. The server verifies the user's authentication token before accepting the connection.
3. Once connected, the server keeps the connection open.
4. Whenever a new notification is generated (for example, a new task assignment or an update), the server immediately sends it to the intended user.
5. The frontend receives the notification and updates the notification panel automatically, so the user does not need to refresh the page.

---

### Overall Workflow
User Login
    |
    v
Frontend connects to WebSocket
    |
    v
Server verifies authentication token
    |
    v
Connection established
    |
    v
New notification generated
    |
    v
Server sends notification instantly
    |
    v
User receives notification

This approach provides a faster and smoother user experience compared to repeatedly polling the server for new notifications.

# Stage 2

# Database Design for Notification System

## 1. Database Choice: MongoDB (NoSQL)

For this notification system, **MongoDB** is a suitable choice because notifications are document-based and can have different formats, such as system alerts, direct messages, reminders, or project updates. Since MongoDB has a flexible schema, new notification types can be added without changing the database structure. It also provides high write performance, making it ideal for applications where notifications are generated frequently.

---

## 2. Database Schema

**Collection:** `notifications`

```json
{
  "_id": "ObjectId",
  "userId": "String",
  "type": "String",
  "message": "String",
  "isRead": "Boolean",
  "createdAt": "ISODate"
}
```

### Field Description

| Field       | Description                                         |
| ----------- | --------------------------------------------------- |
| `_id`       | Unique identifier for each notification             |
| `userId`    | ID of the user who receives the notification        |
| `type`      | Type of notification (Alert, Message, Update, etc.) |
| `message`   | Notification content displayed to the user          |
| `isRead`    | Indicates whether the notification has been read    |
| `createdAt` | Date and time when the notification was created     |

---

## 3. Scaling Challenges and Solutions

### Challenge

As the number of users and notifications increases, retrieving notifications for a particular user may become slower.

### Solution

**Indexing**

Create a compound index on:

```javascript
{ userId: 1, createdAt: -1 }
```

This allows the database to quickly retrieve notifications for a specific user while displaying the newest notifications first.

**TTL (Time-To-Live) Index**

Notifications are usually temporary. A TTL index can automatically remove notifications that are older than 30 or 60 days, reducing storage usage and improving database performance.

---

## 4. Database Queries

### Get All Unread Notifications

Retrieve all unread notifications for a user and sort them by the latest notification.

```javascript
db.notifications.find({
    userId: "user_123",
    isRead: false
}).sort({
    createdAt: -1
});
```

---

### Mark Notification as Read

Update a specific notification by setting its `isRead` field to `true`.

```javascript
db.notifications.updateOne(
    { _id: ObjectId("notif_id_here") },
    {
        $set: {
            isRead: true
        }
    }
);
```

---

### Delete a Notification

Remove a notification from the database.

```javascript
db.notifications.deleteOne({
    _id: ObjectId("notif_id_here")
});
```
# Stage 3

# Database Optimization & Query Analysis

## 1. Analysis of the Existing Query

The existing query is **correct** and retrieves the required notifications. However, when the database contains millions of records (for example, 5,000,000 rows), its performance can become slow if no suitable index is available.

Without an index, the database performs a **full table scan**, meaning it checks every row to find matching records. This increases query execution time significantly as the amount of data grows.

### Suggested Improvement

A **composite index** should be created on the following columns:

```sql
(studentID, isRead, createdAt)
```

This index enables the database to quickly locate notifications for a particular student, filter unread notifications, and return them in chronological order without scanning the entire table.

### Time Complexity

* **Without Index:** O(N), where *N* is the total number of notifications.
* **With Composite Index:** Approximately O(log N + K), where *K* is the number of matching records.

---

## 2. Should Every Column Be Indexed?

No. Indexing every column is not recommended.

### Reasons

* **Storage Overhead:** Every index consumes additional disk space, increasing the overall database size.
* **Slower Write Operations:** INSERT, UPDATE, and DELETE operations become slower because all related indexes must also be updated.
* **Query Optimizer Issues:** Having too many indexes may cause the database optimizer to choose a less efficient execution plan.

Therefore, indexes should only be created on columns that are frequently used in **WHERE**, **JOIN**, **ORDER BY**, or **GROUP BY** clauses.

---

## 3. Query to Retrieve Placement Notifications (Last 7 Days)

The following SQL query retrieves all placement-related notifications created within the last seven days.

```sql
SELECT *
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= CURRENT_DATE - INTERVAL '7 days';
```
# Stage 4

Performance Improvement & Bottleneck Resolution

Fetching notifications every time a user loads a page is not an efficient approach, especially when the application has a large number of users. To improve performance and reduce database load, the following optimization techniques can be used.

---

## 1. Performance Improvement Strategies

### A. Caching (Redis)

**Strategy**

Store frequently accessed notifications in an in-memory cache such as **Redis** instead of querying the database every time.

**How it Works**

* When a user logs in, their recent or unread notifications are loaded into Redis.
* Future requests retrieve notifications directly from Redis.
* The main database is accessed only when the cache is empty or needs to be refreshed.

**Advantages**

* Very fast data retrieval.
* Reduces the number of database queries.
* Improves application response time.

**Disadvantages**

* Additional infrastructure is required.
* Cache synchronization with the database (cache invalidation) adds complexity.

---

### B. Pagination and Lazy Loading

**Strategy**

Instead of loading all notifications at once, load only a small number (such as 10–20 notifications) initially.

**How it Works**

* Display the first set of notifications when the page loads.
* As the user scrolls down, additional notifications are loaded automatically.

**Advantages**

* Reduces the amount of data transferred.
* Faster page loading.
* Lower database and network usage.

**Disadvantages**

* Requires additional frontend logic for infinite scrolling or pagination.

---

### C. Request Throttling

**Strategy**

Reduce unnecessary API requests from the frontend.

**How it Works**

* Fetch notifications only if they have not been updated recently (for example, within the last 5 minutes).
* Alternatively, use the WebSocket connection established earlier so that new notifications are pushed automatically instead of repeatedly requesting them.

**Advantages**

* Prevents excessive API requests.
* Reduces server workload.
* Improves overall application efficiency.

**Disadvantages**

* Requires proper state management to ensure users always receive the latest notifications.

---

## 2. Comparison of Optimization Techniques

| Strategy                  | Performance Improvement | Complexity | Implementation Effort |
| ------------------------- | ----------------------- | ---------- | --------------------- |
| Caching (Redis)           | Very High               | High       | Moderate              |
| Pagination & Lazy Loading | High                    | Low        | Low                   |
| Request Throttling        | Moderate                | Moderate   | Low                   |

---

## Conclusion

Among these techniques, **Caching with Redis** provides the greatest performance improvement by minimizing database access. **Pagination** reduces the amount of data loaded in each request, while **Request Throttling** prevents unnecessary API calls. Combining all three techniques results in a scalable, efficient, and responsive notification system.

# Stage 5

# System Design for Mass Notifications

The current `notify_all()` function processes notifications one student at a time. While this approach works for a small number of users, it does not scale well when notifications need to be sent to thousands of students. For example, sending notifications to **50,000 students** sequentially would take a very long time and significantly reduce system performance.

---

## 1. Limitations of the Current Design

### A. Poor Scalability

The notifications are sent one after another in a loop. As the number of users increases, the total processing time also increases, making the system inefficient for large-scale usage.

### B. Tight Coupling

The system waits for the email service to complete before processing the next notification. If the email server is slow or unavailable, the entire notification process is delayed.

### C. Failure Handling

If the application crashes while sending notifications, there is no reliable way to determine which students have already received the notification and which have not. This can result in inconsistent delivery.

### D. Blocking Operations

Since email sending is an I/O operation, the main application thread remains occupied until the operation finishes, preventing it from performing other important tasks.

---

## 2. Failure Analysis

Suppose email delivery fails for **200 students** due to a temporary server issue.

In a synchronous system, administrators would have to manually identify failed deliveries and resend the emails. This process is time-consuming and prone to errors.

A better approach is to use a **Message Queue** such as **RabbitMQ**, **Apache Kafka**, or **AWS SQS**. Failed notification jobs can be placed into a **Retry Queue** or **Dead Letter Queue (DLQ)**, allowing the system to automatically retry sending them later without manual intervention.

---

## 3. Improved System Design

To improve scalability and reliability, the notification system should use an **asynchronous architecture**.

### Step 1: Save Notification

Store the notification in the database first. This serves as the permanent record (source of truth).

### Step 2: Add Job to Queue

Instead of sending the email immediately, add a notification job to a task queue.

### Step 3: Background Processing

Background worker processes retrieve jobs from the queue and send emails or push notifications independently.

### Step 4: Retry Failed Jobs

If a notification fails, it is automatically moved to a retry queue where it can be processed again without affecting other notifications.

---

## 4. Asynchronous Workflow

```text
Admin Sends Notification
          |
          v
Save Notification in Database
          |
          v
Add Job to Message Queue
          |
          v
Background Worker Picks Job
          |
     +----+----+
     |         |
     v         v
Send Email   Push Notification
     |         |
     +----+----+
          |
          v
Success / Retry if Failed
```

---

## 5. Sample Pseudocode

```python
def notify_all(student_ids, message):

    for student_id in student_ids:

        # Save notification in database
        notification_id = save_to_db(student_id, message)

        # Add job to task queue
        queue.push(
            "send_notification_job",
            {
                "notification_id": notification_id,
                "student_id": student_id,
                "message": message
            }
        )


# Background Worker

def process_notification_job(data):

    try:
        send_email(data["student_id"], data["message"])
        push_notification(data["student_id"], data["message"])

    except Exception:
        retry_job(data)
```

---

## 6. Why Separate the Database and Email Service?

Saving data to the database and sending emails are two independent operations with different reliability requirements.

* The **database** is fast and reliable, so the notification should always be stored first.
* The **email service** is an external system that may experience delays, network failures, or rate limits.

By storing the notification first and processing email delivery in the background, the system ensures that no notification is lost. Even if the email service is temporarily unavailable, the background worker can retry the operation later while the notification remains safely stored in the database.

---

## Conclusion

Using asynchronous processing, message queues, and background workers makes the notification system more scalable, reliable, and fault tolerant. This design enables the system to efficiently send notifications to thousands of users while maintaining good performance and ensuring failed deliveries can be retried automatically.

# Stage 6

Priority Inbox Implementation

To improve the user experience, notifications are displayed based on their importance instead of only by the time they were received. A **Priority Inbox** ensures that important notifications, such as placement updates, appear before less critical notifications like events.

---

## 1. Priority Calculation

Each notification type is assigned a priority value.

| Notification Type | Priority Weight |
| ----------------- | --------------- |
| Placement         | 3               |
| Result            | 2               |
| Event             | 1               |

A **priority score** is calculated using both the notification type and its timestamp.

**Formula**

```
Priority Score = (Priority Weight × Large Constant) + Timestamp
```

This approach ensures that:

* Higher-priority notification types always appear first.
* If two notifications have the same priority, the more recent notification is displayed before the older one.

---

## 2. Efficient Maintenance of Top Notifications

Instead of sorting the complete notification list every time a new notification arrives, the system maintains only the **Top N notifications**.

A **Min-Heap (Priority Queue)** is used for this purpose.

### Working

1. Keep only the top **N** notifications in the heap.
2. When a new notification arrives, calculate its priority score.
3. Compare it with the lowest-priority notification currently in the heap.
4. If the new notification has a higher priority, replace the lowest-priority notification.
5. Otherwise, discard it.

This approach keeps the system efficient even when thousands of notifications are generated.

---

## 3. Sample Implementation (JavaScript)

```javascript
const weights = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

function getPriorityScore(notification) {
    const weight = weights[notification.type] || 0;
    const timestamp = new Date(notification.createdAt).getTime();

    return (weight * 1000000000000) + timestamp;
}

function getTopNotifications(notifications, n) {

    return notifications
        .sort((a, b) =>
            getPriorityScore(b) - getPriorityScore(a)
        )
        .slice(0, n);
}
```

---

## 4. Time Complexity

| Operation                     | Complexity             |
| ----------------------------- | ---------------------- |
| Calculate Priority Score      | O(1)                   |
| Sort Notifications            | O(N log N)             |
| Maintain Top N using Min-Heap | O(log N) per insertion |

---

## 5. Benefits

* Important notifications are displayed before less important ones.
* Recent notifications are prioritized within the same category.
* Efficiently handles a large number of incoming notifications.
* Suitable for real-time notification systems where new notifications arrive frequently.

---

## Conclusion

The Priority Inbox improves notification management by combining **priority levels** and **recency**. Using a **Min-Heap** to maintain the top notifications reduces processing time and makes the system scalable for applications with a large number of users and frequent notification updates.
