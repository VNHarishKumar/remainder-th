from django.http import JsonResponse
from .models import remainder
from .seralizer import Remainderseralizer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import boto3
from django.conf import settings

@api_view(['GET','POST'])
def post_remainder(request):
     
     if request.method == 'GET':
        rem = remainder.objects.all()
        seralize = Remainderseralizer(rem, many = True)
        return JsonResponse( seralize.data, safe=False)

     if request.method == 'POST':
        seralize = Remainderseralizer(data=request.data)
        if seralize.is_valid():
            seralize.save()
            send_sns_notification(seralize.data)
            return  Response(seralize.data, status = status.HTTP_201_CREATED)
        print(seralize.errors)
        return Response(seralize.errors, status=status.HTTP_400_BAD_REQUEST)
     
def send_sns_notification(remainder_data):
    sns_client = boto3.client('sns', region_name='us-east-1')  
    topic_arn = 'arn:aws:sns:us-east-1:924858102654:remainder'
    
    message = f"New Remainder Created:\nTitle: {remainder_data['title']}\nDescription: {remainder_data['description']}\nDate: {remainder_data['date']}"
    subject = "New Remainder Notification"
    
    sns_client.publish(
        TopicArn=topic_arn,
        Message=message,
        Subject=subject
    )

@api_view(['GET','PUT','PATCH','DELETE'])        
def remainder_detail(request,id):

    try:
        obj = remainder.objects.get(pk=id)
    except remainder.DoesNotExist:
        return Response(status = status.HTTP_404_NOT_FOUND) 
    
    if request.method == 'GET':
        serialize = Remainderseralizer(obj)
        return Response(serialize.data)
    
    elif request.method == 'PUT':
        serialize = Remainderseralizer(obj, data=request.data)
        if serialize.is_valid():
            serialize.save()
            return Response(serialize.data,status=status.HTTP_204_NO_CONTENT)
        return Response(serialize.errors,status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PATCH':  # Handling PATCH method for partial updates
        serializer = Remainderseralizer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        try:
            rem = remainder.objects.get(pk=id)
            rem.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except remainder.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
