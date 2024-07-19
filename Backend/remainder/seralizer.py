from rest_framework import serializers
from .models import remainder

class Remainderseralizer(serializers.ModelSerializer):
    class Meta:
        model = remainder
        fields = ['id','title','description','date', 'completed'] 
