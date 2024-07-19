from django.db import models

class remainder(models.Model):
    title = models.CharField(max_length = 100)
    description =  models.TextField()
    date = models.DateField()
    completed = models.BooleanField(default=False)

    def __str__ (self):
        return self.title