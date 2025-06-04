from django.contrib import admin
from .models import Task, TaskComment, TaskAttachment

class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ['created_at', 'created_by']

class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 0
    readonly_fields = ['created_at', 'created_by', 'file_size']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'assigned_to', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    inlines = [TaskCommentInline, TaskAttachmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'tags')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'assigned_group')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'progress_percentage')
        }),
        ('Timing', {
            'fields': ('due_date', 'started_at', 'completed_at', 'estimated_hours', 'actual_hours')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )