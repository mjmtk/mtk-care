from rest_framework.response import Response
from rest_framework.decorators import api_view
# Commented out as base module is not available
# from base.models import Item
from .serializers import ItemSerializer

@api_view(['GET'])
def getData(request):
    # Return a simple response for testing
    person = {'name': 'Aftab', 'age': 21}
    return Response(person)
    
@api_view(['POST'])
def createItem(request):
    # Use our placeholder serializer
    serializer = ItemSerializer(data=request.data)
    if serializer.is_valid():
        # Just return the validated data
        return Response(serializer.validated_data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def getItems(request):
    # Return a placeholder list of items for testing
    items = [{'id': 1, 'name': 'Test Item 1', 'description': 'This is a placeholder item'}, 
             {'id': 2, 'name': 'Test Item 2', 'description': 'This is another placeholder item'}]
    # Return the items directly since we're using placeholder data
    return Response(items)

@api_view(['GET'])
def getItem(request, pk):
    # Return a placeholder item for testing
    item = {'id': pk, 'name': f'Test Item {pk}', 'description': 'This is a placeholder item'}
    return Response(item)

@api_view(['PUT'])
def updateItem(request, pk):
    # Use our placeholder serializer
    serializer = ItemSerializer(data=request.data)
    if serializer.is_valid():
        # Just return the validated data with the id
        result = serializer.validated_data
        result['id'] = pk
        return Response(result)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def deleteItem(request, pk):
    # Just return a success message
    return Response({'message': f'Item {pk} successfully deleted!'})
