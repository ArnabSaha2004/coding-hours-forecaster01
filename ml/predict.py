import joblib
import pandas as pd

model = joblib.load('ml/model.pkl')

sample = pd.DataFrame([['Coding','AI','Yes']], columns=['hobby_top1','club_top1','reads_books'])
print('Predicted coding hours:', model.predict(sample)[0])
